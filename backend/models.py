from datetime import datetime, date
from typing import Any, Dict, List, Optional
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import event
from sqlalchemy.engine import Engine

db = SQLAlchemy()


@event.listens_for(Engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    """Enables foreign key constraint enforcement in SQLite."""
    try:
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()
    except Exception:
        pass


class IdentitasKK(db.Model):
    """
    Model for tbl_identitasKK: stores family card header & address metadata.
    """
    __tablename__ = "tbl_identitasKK"
    __table_args__ = {"quote": True}

    id = db.Column(db.BigInteger().with_variant(db.Integer, "sqlite"), primary_key=True, autoincrement=True)
    no_kk = db.Column(db.String(16), unique=True, nullable=False, index=True)
    nama_kepala_keluarga = db.Column(db.String(255), nullable=False, index=True)
    alamat = db.Column(db.Text, nullable=False)
    rt = db.Column(db.String(10), default="")
    rw = db.Column(db.String(10), default="")
    desa_kelurahan = db.Column(db.String(100), default="")
    kecamatan = db.Column(db.String(100), default="")
    kabupaten_kota = db.Column(db.String(100), default="")
    provinsi = db.Column(db.String(100), default="")
    kode_pos = db.Column(db.String(10), default="")
    tanggal_dikeluarkan = db.Column(db.Date, nullable=True)
    gambar = db.Column(db.String(255), nullable=True)  # Filename of uploaded image
    created_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = db.Column(
        db.DateTime(timezone=True),
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    # 1 KK -> many Anggota with CASCADE delete in ORM and DB
    anggota = db.relationship(
        "AnggotaKeluargaKK",
        backref="identitas_kk",
        cascade="all, delete-orphan",
        order_by="AnggotaKeluargaKK.no_urut",
        passive_deletes=True,
    )

    @property
    def rt_rw(self) -> str:
        if self.rt or self.rw:
            return f"{self.rt or '000'} / {self.rw or '000'}"
        return ""

    def to_dict(self, include_anggota: bool = False, base_url: str = "") -> Dict[str, Any]:
        gambar_url = f"{base_url}/api/uploads/{self.gambar}" if self.gambar else None

        result = {
            "id": self.id,
            "no_kk": self.no_kk,
            "nama_kepala_keluarga": self.nama_kepala_keluarga,
            "alamat": self.alamat,
            "rt": self.rt or "",
            "rw": self.rw or "",
            "rt_rw": self.rt_rw,
            "desa_kelurahan": self.desa_kelurahan or "",
            "kecamatan": self.kecamatan or "",
            "kabupaten_kota": self.kabupaten_kota or "",
            "provinsi": self.provinsi or "",
            "kode_pos": self.kode_pos or "",
            "tanggal_dikeluarkan": self.tanggal_dikeluarkan.isoformat() if self.tanggal_dikeluarkan else None,
            "gambar": self.gambar or "",
            "gambar_url": gambar_url,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "jumlah_anggota": len(self.anggota) if self.anggota else 0,
        }
        if include_anggota:
            result["anggota"] = [a.to_dict() for a in self.anggota]
        return result


class AnggotaKeluargaKK(db.Model):
    """
    Model for tbl_anggotaKeluargaKK: stores family card member biodata and relations.
    """
    __tablename__ = "tbl_anggotaKeluargaKK"
    __table_args__ = {"quote": True}

    id = db.Column(db.BigInteger().with_variant(db.Integer, "sqlite"), primary_key=True, autoincrement=True)
    id_kk = db.Column(
        db.BigInteger().with_variant(db.Integer, "sqlite"),
        db.ForeignKey("tbl_identitasKK.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    no_urut = db.Column(db.Integer, nullable=False, default=1)
    nama_lengkap = db.Column(db.String(255), nullable=False)
    nik = db.Column(db.String(16), nullable=False, index=True)
    jenis_kelamin = db.Column(db.String(20), nullable=False)  # LAKI-LAKI / PEREMPUAN
    tempat_lahir = db.Column(db.String(100), nullable=False)
    tanggal_lahir = db.Column(db.Date, nullable=False)
    agama = db.Column(db.String(50), default="")
    pendidikan = db.Column(db.String(100), default="")
    jenis_pekerjaan = db.Column(db.String(100), default="")
    golongan_darah = db.Column(db.String(10), default="-")
    status_perkawinan = db.Column(db.String(50), default="")
    tanggal_perkawinan = db.Column(db.Date, nullable=True)
    status_hubungan_dalam_keluarga = db.Column(db.String(50), nullable=False)
    kewarganegaraan = db.Column(db.String(10), default="WNI")
    no_paspor = db.Column(db.String(50), nullable=True)
    no_kitas_kitap = db.Column(db.String(50), nullable=True)
    nama_ayah = db.Column(db.String(255), default="")
    nama_ibu = db.Column(db.String(255), default="")
    created_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = db.Column(
        db.DateTime(timezone=True),
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "id_kk": self.id_kk,
            "no_urut": self.no_urut,
            "nama_lengkap": self.nama_lengkap,
            "nik": self.nik,
            "jenis_kelamin": self.jenis_kelamin,
            "tempat_lahir": self.tempat_lahir,
            "tanggal_lahir": self.tanggal_lahir.isoformat() if self.tanggal_lahir else None,
            "agama": self.agama or "",
            "pendidikan": self.pendidikan or "",
            "jenis_pekerjaan": self.jenis_pekerjaan or "",
            "golongan_darah": self.golongan_darah or "-",
            "status_perkawinan": self.status_perkawinan or "",
            "tanggal_perkawinan": self.tanggal_perkawinan.isoformat() if self.tanggal_perkawinan else None,
            "status_hubungan_dalam_keluarga": self.status_hubungan_dalam_keluarga or "",
            "status_hubungan": self.status_hubungan_dalam_keluarga or "",  # alias for compatibility
            "kewarganegaraan": self.kewarganegaraan or "WNI",
            "no_paspor": self.no_paspor or "",
            "no_kitas_kitap": self.no_kitas_kitap or "",
            "nama_ayah": self.nama_ayah or "",
            "nama_ibu": self.nama_ibu or "",
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
